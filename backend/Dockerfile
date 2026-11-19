# ==============================================================================
# MushroomHub Spring Boot API - Production Dockerfile for Render
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build the Spring Boot application using Maven & Java 17
# ------------------------------------------------------------------------------
FROM maven:3.9-eclipse-temurin-17-alpine AS builder

WORKDIR /app

# Cache dependencies layer
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build executable JAR
COPY src ./src
RUN mvn clean package -DskipTests

# ------------------------------------------------------------------------------
# Stage 2: Minimal Production Runtime using Eclipse Temurin JRE 17
# ------------------------------------------------------------------------------
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Create a non-root system group and user for secure container execution
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy the executable Spring Boot JAR from builder stage
COPY --from=builder --chown=spring:spring /app/target/mushroomhub-api-1.0.0.jar app.jar

# Render automatically injects the PORT environment variable at runtime (defaults to 8080)
ENV PORT=8080
EXPOSE 8080

# Execute Spring Boot with container memory optimization and dynamic port binding
ENTRYPOINT ["sh", "-c", "exec java -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Dserver.port=${PORT:-8080} -jar app.jar"]
